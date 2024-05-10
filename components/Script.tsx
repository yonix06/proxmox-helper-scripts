'use client'
import { pb } from "@/lib/pocketbase";
import Image from "next/image";
import { Suspense, useEffect, useState } from "react";
import { extractDate } from "@/lib/time";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { Clipboard, Info, X } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { Script } from "@/lib/types";
import { useSearchParams  } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LatestScripts from "./LatestScripts";

function ScriptItem() {
  const [item, setItem] = useState<Script | null>(null);
  const id = useSearchParams().get("id");

  const getItem = async () => {
    const record = await pb.collection("proxmox_scripts").getOne(`${id}`, {});
    setItem(record as unknown as Script);
  };

  useEffect(() => {
    if (id) {
      getItem();
    } else {
      setItem(null);
    }
  }, [id]);

  function handleCopy(type: string, value: any) {
    navigator.clipboard.writeText(value);
    toast(
      <div className="flex items-center gap-2">
        <Clipboard className="h-4 w-4" />
        <span>Copied {type} to clipboard</span>
      </div>,
    );
  }

  function closeScript() {
    // remove the id from the url and reset the state
    window.history.pushState({}, document.title, window.location.pathname);
    setItem(null);
  }

  function descriptionCodeBlock(description: string) {
    const pattern = /`([^`]*)`/g;
    const parts = description.split(pattern);

    const formattedDescription = parts.map((part: string, index: number) => {
      if (index % 2 === 1) {
        return (
          <Button
            variant={"secondary"}
            size={"sm"}
            key={index}
            onClick={() => handleCopy("command", part)}
          >
            {part}
          </Button>
        );
      } else {
        return part;
      }
    });

    return formattedDescription;
  }

  const [width, setWidth] = useState<number>(
    typeof window !== "undefined" ? window.innerWidth : 0,
  );

  function handleWindowSizeChange() {
    if (typeof window !== "undefined") {
      setWidth(window.innerWidth);
    }
  }
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.addEventListener("resize", handleWindowSizeChange);
      return () => {
        window.removeEventListener("resize", handleWindowSizeChange);
      };
    }
  }, []);

  const isMobile = width <= 640;

  return (
    <Suspense fallback={null}>
      {item && (
        <div className="mr-7 mt-0 flex h-screen w-full rounded-lg">
          <div className="flex w-full sm:fixed sm:max-w-xl md:max-w-2xl lg:max-w-3xl xl:max-w-4xl ">
            <div className="flex w-full flex-col">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Selected script</h2>
                <X onClick={closeScript} className="cursor-pointer" />
              </div>
              <div className="mt-5 flex justify-between ">
                <div className="flex">
                  <Image
                    className="h-32 w-32 rounded-lg bg-accent object-contain p-3"
                    src={item.logo}
                    width={400}
                    height={400}
                    alt={item.title}
                    priority={true}
                  />
                  <div className="ml-4 flex flex-col justify-between">
                    <div className="flex h-full w-full flex-col justify-between">
                      <div>
                        <h1 className="text-lg font-semibold">{item.title}</h1>
                        <p className="w-full text-sm text-muted-foreground">
                          Date added: {extractDate(item.created)}
                        </p>
                      </div>
                      <div className="flex gap-5">
                        {item.default_cpu && (
                          <div>
                            <h2 className="text-md font-semibold">
                              Default settings
                            </h2>
                            <p className="text-sm text-muted-foreground">
                              CPU: {item.default_cpu}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              RAM: {item.default_ram}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              HDD: {item.default_hdd}
                            </p>
                          </div>
                        )}
                        {item.hasAlpineScript && (
                          <div>
                            <h2 className="text-md font-semibold">
                              Default Alpine settings
                            </h2>
                            <p className="text-sm text-muted-foreground">
                              CPU: {item.alpine_default_cpu}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              RAM: {item.alpine_default_ram}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              HDD: {item.alpine_default_hdd}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="hidden flex-col justify-between gap-2 sm:flex">
                  <div>
                    {item.port !== 0 && (
                      <div className="flex items-center justify-end">
                        <h2 className="mr-2 text-end text-lg font-semibold">
                          Default Port:
                        </h2>{" "}
                        <Button
                          variant={"secondary"}
                          size={"sm"}
                          onClick={() => handleCopy("port", item.port)}
                        >
                          {item.port}
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end gap-2">
                    {item.website && (
                      <Button variant="outline" asChild>
                        <Link target="_blank" href={item.website}>
                          Website
                        </Link>
                      </Button>
                    )}
                    {item.documentation && (
                      <Button variant="outline" asChild>
                        <Link target="_blank" href={item.documentation}>
                          Documentation
                        </Link>
                      </Button>
                    )}
                    {item.post_install && (
                      <Button variant="outline" asChild>
                        <Link target="_blank" href={item.post_install}>
                          Post Install
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              <Separator className="mt-5" />
              <div>
                <div className="mt-5">
                  <h2 className="max-w-prose text-lg font-semibold">
                    Description
                  </h2>
                  <p className="text-sm">
                    {descriptionCodeBlock(item.description)}
                  </p>
                  {item.alert1 && (
                    <div className="mt-4 flex flex-col gap-1">
                      <p className="flex items-center gap-2 text-sm">
                        <Info className="h-4 min-h-4 w-4 min-w-4" />
                        {descriptionCodeBlock(item.alert1)}
                      </p>
                      {item.alert2 && (
                        <p className="flex  items-center gap-2 text-sm">
                          <Info className="min-w-42 h-4 min-h-4 w-4" />
                          {descriptionCodeBlock(item.alert2)}
                        </p>
                      )}
                      {item.alert3 && (
                        <p className="flex items-center gap-2 text-sm">
                          <Info className="h-4 min-h-4 w-4 min-w-4" />
                          {descriptionCodeBlock(item.alert3)}
                        </p>
                      )}
                    </div>
                  )}
                </div>
                <Separator className="mt-5" />
                <div className="mt-5">
                  <h2 className="text-lg font-semibold">
                    How to {item.item_type ? "install" : "use"}
                  </h2>
                  {item.hasAlpineScript ? (
                    <Tabs
                      defaultValue="default"
                      className="mt-2 w-full max-w-4xl"
                    >
                      <TabsList>
                        <TabsTrigger value="default">Default</TabsTrigger>
                        <TabsTrigger value="alpine">Alpine Linux</TabsTrigger>
                      </TabsList>
                      <TabsContent value="default">
                        {item.item_type && (
                          <>
                            <p className="text-sm">
                              To create a new Proxmox VE {item.title}{" "}
                              {item.item_type}, run the command below in the
                              Proxmox VE Shell.
                            </p>
                            {item.isUpdateable && (
                              <p className="text-sm">
                                To Update {item.title}, run the command below
                                (or type update) in the LXC Console.
                              </p>
                            )}
                          </>
                        )}
                        <p className="mt-3 pb-1 pl-1 text-xs text-muted-foreground">
                          click to copy
                        </p>
                        <Button
                          variant="secondary"
                          size={"sm"}
                          onClick={() =>
                            handleCopy("install command", item.installCommand)
                          }
                        >
                          {!isMobile && item.installCommand
                            ? item.installCommand
                            : "Copy install command"}
                        </Button>
                      </TabsContent>
                      <TabsContent value="alpine">
                        {item.hasAlpineScript && (
                          <>
                            <p className="mt-2 max-w-2xl text-sm">
                              As an alternative option, you can use Alpine Linux
                              and the {item.title} package to create a{" "}
                              {item.title} {item.item_type} container with
                              faster creation time and minimal system resource
                              usage.
                            </p>
                            <p className="mt-2 flex text-sm">
                              To create a new Proxmox VE Alpine-{item.title}{" "}
                              {item.item_type}, run the command below in the
                              Proxmox VE Shell
                            </p>
                            <p className="mt-3 pb-1 pl-1 text-xs text-muted-foreground">
                              click to copy
                            </p>
                            <Button
                              variant={"secondary"}
                              size={"sm"}
                              onClick={() =>
                                handleCopy("install command", item.alpineScript)
                              }
                            >
                              {!isMobile && item.alpineScript
                                ? item.alpineScript
                                : "Copy install command"}
                            </Button>
                          </>
                        )}
                      </TabsContent>
                    </Tabs>
                  ) : (
                    <>
                      {item.item_type && (
                        <>
                          <p className="text-sm">
                            To create a new Proxmox VE {item.title}{" "}
                            {item.item_type}, run the command below in the
                            Proxmox VE Shell.
                          </p>
                          {item.isUpdateable && (
                            <p className="text-sm">
                              To Update {item.title}, run the command below (or
                              type update) in the LXC Console.
                            </p>
                          )}
                        </>
                      )}
                      <p className="mt-3 pb-1 pl-1 text-xs text-muted-foreground">
                        click to copy
                      </p>
                      <Button
                        variant="secondary"
                        size={"sm"}
                        onClick={() =>
                          handleCopy("install command", item.installCommand)
                        }
                      >
                        {!isMobile && item.installCommand
                          ? item.installCommand
                          : "Copy install command"}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {item ? null : (
        <>
          <LatestScripts />
        </>
      )}
    </Suspense>
  );
};

export default ScriptItem;